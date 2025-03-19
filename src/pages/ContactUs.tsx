import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this data to your backend
    console.log("Form submitted:", formData);
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>

      <div className="max-w-3xl mx-auto">
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <p className="text-center mb-6">
              You may contact us using the information below:
            </p>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Address</h3>
                <address className="not-italic text-muted-foreground">
                  Vignarajapuram 1st Main Road <br />
                  Santhosapuram Kanchipuram <br />
                  TAMIL NADU 600073
                </address>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-muted-foreground">+91 9363020252</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">contact@konipai.in</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                name="message" 
                rows={5} 
                value={formData.message} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs; 